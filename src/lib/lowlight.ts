import { createLowlight, common } from 'lowlight'

export const lowlight = createLowlight(common)
export type LowlightInstance = typeof lowlight
