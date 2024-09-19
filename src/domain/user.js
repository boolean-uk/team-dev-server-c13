import dbClient from '../utils/dbClient.js'
import bcrypt from 'bcrypt'

export default class User {
  /**
   * This is JSDoc - a way for us to tell other developers what types functions/methods
   * take as inputs, what types they return, and other useful information that JS doesn't have built in
   * @tutorial https://www.valentinog.com/blog/jsdoc
   *
   * @param { { id: int, cohortId: int, email: string, profile: { firstName: string, lastName: string, bio: string, githubUrl: string } } } user
   * @returns {User}
   */
  static fromDb(user) {
    return new User(
      user.id,
      user.cohortId,
      user.profile?.firstName,
      user.profile?.lastName,
      user.email,
      user.profile?.bio,
      user.profile?.githubUrl,
      user.profile?.profilePicture,
      user.password,
      user.role,
      user.username,
      user.profile?.mobile,
      user.profile?.specialism,
      user.cohortId ? user.cohort.startDate : null,
      user.cohortId ? user.cohort.endDate : null
    )
  }

  static async fromJson(json) {
    // eslint-disable-next-line camelcase
    const {
      firstName,
      lastName,
      email,
      bio,
      githubUrl,
      password,
      profilePicture
    } = json

    const passwordHash = await bcrypt.hash(password, 8)

    return new User(
      null,
      null,
      firstName,
      lastName,
      email,
      bio,
      githubUrl,
      profilePicture,
      passwordHash
    )
  }

  constructor(
    id,
    cohortId,
    firstName,
    lastName,
    email,
    bio,
    githubUrl,
    profilePicture,
    passwordHash = null,
    role = 'STUDENT',
    username,
    mobile,
    specialism,
    startDate,
    endDate
  ) {
    this.id = id
    this.cohortId = cohortId
    this.firstName = firstName
    this.lastName = lastName
    this.email = email
    this.bio = bio
    this.githubUrl = githubUrl
    this.profilePicture = profilePicture
    this.passwordHash = passwordHash
    this.role = role
    this.username = username
    this.mobile = mobile
    this.specialism = specialism
    this.startDate = cohortId ? startDate : null
    this.endDate = cohortId ? endDate : null
  }

  toJSON() {
    return {
      user: {
        id: this.id,
        cohortId: this.cohortId,
        role: this.role,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        bio: this.bio,
        githubUrl: this.githubUrl,
        profilePicture: this.profilePicture,
        username: this.username,
        mobile: this.mobile,
        specialism: this.specialism,
        startDate: this.startDate,
        endDate: this.endDate
      }
    }
  }

  /**
   * @returns {User}
   *  A user instance containing an ID, representing the user data created in the database
   */
  async save() {
    const data = {
      email: this.email,
      password: this.passwordHash,
      role: this.role
    }

    if (this.cohortId) {
      data.cohort = {
        connectOrCreate: {
          id: this.cohortId
        }
      }
    }

    if (this.firstName && this.lastName) {
      data.profile = {
        create: {
          firstName: this.firstName,
          lastName: this.lastName,
          bio: this.bio,
          githubUrl: this.githubUrl
        }
      }
    }
    const createdUser = await dbClient.user.create({
      data,
      include: {
        profile: true,
        cohort: true
      }
    })

    return User.fromDb(createdUser)
  }

  static async findByEmail(email) {
    return User._findByUnique('email', email)
  }

  static async findById(id) {
    return User._findByUnique('id', id)
  }

  static async findManyByFirstName(firstName) {
    return User._findMany('name', firstName)
  }

  static async findManyByName(searchTerms) {
    return dbClient.user.findMany({
      where: {
        OR: searchTerms.map((searchTerm) => [
          {
            profile: {
              firstName: {
                contains: searchTerm,
                mode: 'insensitive' // Optional: Makes the search case-insensitive
              }
            }
          },
          {
            profile: {
              lastName: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        ])
      },
      include: {
        profile: true
      }
    })
  }

  static async findAll() {
    return User._findMany()
  }

  static async _findByUnique(key, value) {
    const foundUser = await dbClient.user.findUnique({
      where: {
        [key]: value
      },
      include: {
        profile: true,
        cohort: true
      }
    })

    if (foundUser) {
      return User.fromDb(foundUser)
    }

    return null
  }

  static async _findMany(key, value) {
    const query = {
      include: {
        profile: true
      }
    }

    if (key !== undefined && value !== undefined) {
      query.where = {
        profile: {
          [key]: value
        }
      }
    }

    const foundUsers = await dbClient.user.findMany(query)

    return foundUsers.map((user) => User.fromDb(user))
  }

  static async updateUser(id, updateData) {
    const {
      firstName,
      lastName,
      bio,
      githubUrl,
      profilePicture,
      cohortId,
      role,
      username,
      mobile,
      specialism
    } = updateData

    // Function to update profile id
    const updatedUser = await dbClient.user.update({
      where: { id: id },
      data: { cohortId: cohortId, role: role, username: username },
      include: { profile: true, cohort: true }
    })

    const profileData = {
      firstName,
      lastName,
      bio,
      githubUrl,
      profilePicture,
      specialism,
      mobile
    }

    // Function to update profile or create profile if it does not exist
    if (updatedUser.profile) {
      await dbClient.profile.update({
        where: { userId: id },
        data: profileData
      })
    } else {
      await dbClient.profile.create({
        data: {
          userId: id,
          ...profileData
        }
      })
    }

    const foundUser = await dbClient.user.findUnique({
      where: { id: id },
      include: { profile: true, cohort: true }
    })

    return User.fromDb(foundUser)
  }

  static async findUserWithGradesById(id) {
    const userWithGrades = await dbClient.user.findUnique({
      where: { id: id },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        cohort: true,
        grades: {
          include: {
            exercise: true
          }
        }
      }
    })

    if (!userWithGrades) {
      return null
    }

    const modules = await dbClient.module.findMany({
      include: {
        units: {
          include: {
            exercises: true
          }
        }
      }
    })

    return {
      user: userWithGrades,
      modules: modules
    }
  }
}
