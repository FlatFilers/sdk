import {
  CompleteParams,
  ErrorParams,
  InitParams,
  LaunchParams,
  UploadParams,
} from './params.interface'

export interface FlatfileMethods {
  onInit?: (params: InitParams) => void
  onUpload?: (params: UploadParams) => void
  onError?: (params: ErrorParams) => void
  onLaunch?: (params: LaunchParams) => void
  onComplete?: (params: CompleteParams) => void
  onClose?: () => void
}
