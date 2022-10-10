export const WAIT_TIME_BEFORE_START_POLLING = 20 * 1000
export const POLLING_INTERVAL = 10 * 1000

export const handlePollFallback = (
  fallbackMethod: () => Promise<any | null>,
  cb: (param: any) => void,
  waitTimeBeforeStartPoll = WAIT_TIME_BEFORE_START_POLLING,
  pollingInterval = POLLING_INTERVAL
): void => {
  let idInterval: NodeJS.Timeout

  const idTimeout: NodeJS.Timeout = setTimeout(() => {
    clearInterval(idInterval)
    idInterval = setInterval(async () => {
      const result = await fallbackMethod()

      if (result) {
        cb(result)
        clearTimers()
      }
    }, pollingInterval)
  }, waitTimeBeforeStartPoll)

  const clearTimers = () => {
    clearTimeout(idTimeout)
    clearInterval(idInterval)
  }
}
