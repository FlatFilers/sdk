import { IEvents } from '@flatfile/sdk'

export type InitParams = IEvents['init']
export type UploadParams = IEvents['upload']
export type ErrorParams = IEvents['error']
export type LaunchParams = IEvents['launch']
export type CompleteParams = IEvents['complete']
export type CloseParams = IEvents['close']
