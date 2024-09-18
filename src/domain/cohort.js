import dbClient from '../utils/dbClient.js'

/**
 * Create a new Cohort in the database
 * @returns {Cohort}
 */
export async function createCohort() {
  const createdCohort = await dbClient.cohort.create({
    data: {}
  })

  return new Cohort(createdCohort.id)
}

export async function getCohort(cohortId) {
  const cohort = await dbClient.cohort.findUnique({
    where: { id: cohortId },
    // select: {
    //   cohortName: true,
    //   startDate: true,
    //   endDate: true
    // },
    include: {
      users: true
    }
  })

  return cohort
}

export class Cohort {
  constructor(id = null) {
    this.id = id
  }

  toJSON() {
    return {
      cohort: {
        id: this.id
      }
    }
  }
}
