import { Prebid } from '../models/pbjs'

export {}

declare global {
  interface Window {
    pbjs: Prebid | undefined
  }
}
