import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'
import dbClient from '../utils/dbClient.js'

export const create = async (req, res) => {
  const { content } = req.body
  const userId = req.user.id

  if (!content) {
    return sendDataResponse(res, 400, { content: 'Must provide content' })
  }

  try {
    const post = await dbClient.post.create({
      data: {
        content: content,
        userId: userId
      }
    })

    return sendDataResponse(res, 201, { posts: { id: post.id, content } })
  } catch (e) {
    return res.status(401).json({ error: 'Not authorised' })
  }
}

export const getAll = async (req, res) => {
  try {
    const posts = await dbClient.post.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            cohortId: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                bio: true,
                githubUrl: true,
                profilePicture: true
              }
            }
          }
        }
      }
    })
    return sendDataResponse(res, 200, { posts: posts })
  } catch (e) {
    return sendMessageResponse(res, 500, 'Unable to fetch')
  }
}
