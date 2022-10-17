import { handlePollFallback } from './handlePollFallback'

const wait = async (time = 0) => await new Promise((resolve) => setTimeout(resolve, time))

describe('handlePollFallback', () => {
  test('should execute poll method and callback', async () => {
    const fallbackMethod = jest.fn().mockResolvedValue(Promise.resolve({ result: true }))
    const callback = jest.fn()

    handlePollFallback(fallbackMethod, callback, 0, 0)

    await wait(100)

    expect(fallbackMethod).toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith(true)
  })

  test('should execute poll method, but not callback', async () => {
    const fallbackMethod = jest.fn().mockResolvedValue(Promise.resolve(false))
    const callback = jest.fn()

    handlePollFallback(fallbackMethod, callback, 0, 0)

    await wait(100)

    expect(fallbackMethod).toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
  })
})
