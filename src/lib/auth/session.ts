import { getServerSession } from 'next-auth'

import { authOptions } from './config'

export const getCurrentSession = () => getServerSession(authOptions)
