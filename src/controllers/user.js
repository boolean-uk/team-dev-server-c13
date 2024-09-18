import User from '../domain/user.js'
import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'

export const create = async (req, res) => {
  const userToCreate = await User.fromJson(req.body)

  try {
    const existingUser = await User.findByEmail(userToCreate.email)

    if (existingUser) {
      return sendDataResponse(res, 400, { email: 'Email already in use' })
    }

    const createdUser = await userToCreate.save()

    return sendDataResponse(res, 201, createdUser)
  } catch (error) {
    return sendMessageResponse(res, 500, 'Unable to create new user')
  }
}

export const getById = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const foundUser = await User.findById(id)

    if (!foundUser) {
      return sendDataResponse(res, 404, { id: 'User not found' })
    }

    return sendDataResponse(res, 200, foundUser)
  } catch (e) {
    return sendMessageResponse(res, 500, 'Unable to get user')
  }
}

export const getAll = async (req, res) => {
  // Destructure first_name and last_name from query parameters
  const { first_name: firstName, last_name: lastName } = req.query

  let foundUsers

  // If both firstName and lastName are provided, search by both
  if (firstName && lastName) {
    foundUsers = await User.findManyByFullName(firstName, lastName)
  }
  // If only firstName is provided, search by first name
  else if (firstName) {
    foundUsers = await User.findManyByFirstName(firstName)
  }
  // If only lastName is provided, search by last name
  else if (lastName) {
    foundUsers = await User.findManyByLastName(lastName)
  }
  // If no search criteria, fetch all users
  else {
    foundUsers = await User.findAll()
  }

  // Format the users for response
  // eslint-disable-next-line camelcase
  const { search } = req.query

  if (!search || !search.trim()) {
    const allUsers = await User.findAll()
    return sendDataResponse(res, 200, { users: allUsers })
  }

  // remove any spaces around query, then split by one or more empty spaces
  const formattedSearch = search.trim().split(/\s+/)

  const foundUsers = await User.findManyByName(formattedSearch)

  const formattedUsers = foundUsers.map((user) => {
    return {
      ...user.toJSON().user
    }
  })

  return sendDataResponse(res, 200, { users: formattedUsers })
}

export const updateById = async (req, res) => {
  const id = Number(req.params.id)
  const {
    firstName,
    lastName,
    bio,
    githubUrl,
    cohortId,
    profilePicture,
    role,
    username,
    specialism,
    mobile
  } = req.body

  try {
    // Check user you want to update exists:
    const foundUserId = await User.findById(id)

    if (!foundUserId) {
      return sendDataResponse(res, 404, { error: 'User not found' })
    }

    // Check whether user is authorised
    const canUpdateProfile = req.user.id === id || req.user.role === 'TEACHER'

    if (canUpdateProfile === false) {
      return res
        .status(403)
        .json({ error: 'User not authorized to make this change.' })
    }

    if (req.user.id === id) {
      if (!firstName || !lastName) {
        return sendDataResponse(res, 400, {
          error: 'First name and Last name is required'
        })
      }
    }

    // inject fields if not null in payload
    const updateData = {
      firstName,
      lastName,
      ...(bio && { bio }),
      ...(githubUrl && { githubUrl }),
      ...(profilePicture && { profilePicture }),
      ...(username && { username }),
      ...(specialism && { specialism }),
      ...(mobile && { mobile })
    }

    if (req.user.role === 'TEACHER') {
      if (cohortId) {
        updateData.cohortId = cohortId
      }

      if (role) {
        updateData.role = role
      }
    }
    const updatedUser = await User.updateUser(id, updateData)
    delete updatedUser.password
    return sendDataResponse(res, 201, updatedUser)
  } catch (e) {
    if (e.code === 'P2002') {
      return sendDataResponse(res, 400, {
        error: 'A user with this username already exists'
      })
    }

    return sendMessageResponse(res, 500, 'Server Error')
  }
}
