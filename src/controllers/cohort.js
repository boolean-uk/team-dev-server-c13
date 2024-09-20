import { createCohort, getCohort } from '../domain/cohort.js'
import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'

export const create = async (req, res) => {
  try {
    const createdCohort = await createCohort()

    return sendDataResponse(res, 201, createdCohort)
  } catch (e) {
    return sendMessageResponse(res, 500, 'Unable to create cohort')
  }
}

export const get = async (req, res) => {
  const cohortId = parseInt(req.params.id)

  if (isNaN(cohortId)) {
    return sendMessageResponse(res, 400, 'Invalid cohort ID')
  }

  try {
    const cohort = await getCohort(cohortId)

    if (!cohort) {
      return sendMessageResponse(res, 404, 'Cohort not found')
    }

    return sendDataResponse(res, 200, cohort)
  } catch (e) {
    return sendMessageResponse(res, 500, 'Unable to get cohort')
  }
}
