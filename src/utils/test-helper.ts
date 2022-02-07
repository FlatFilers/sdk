import nock from 'nock'

export const mockOneGraphQLRequest = (
  reqName: string,
  responseCode = 200,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any = {}
): void => {
  nock(/.+/)
    .post('/graphql')
    .once()
    .reply(responseCode, {
      data: {
        [reqName]: payload,
      },
    })
}
