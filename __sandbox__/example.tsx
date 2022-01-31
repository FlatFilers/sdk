import { Flatfile } from '../src'

const test = async () => {
  const email = 'john@doe.com'

  const flatfile = await Flatfile.initializeFromRawToken({
    embed: '000-000',
    sub: 'john@doe.com',
    user: { id: email, email, name: 'Unknown' },
    org: { id: email, name: 'Unknown' },
  })

  // todo: think about custom errors
  flatfile.setErrorHandler(() => {
    // show in a dialog
  }, ['ERROR1', 'ERROR2'])

  const batch = await flatfile.startOrResumeBatch({ openIframe: true })

  batch.on('complete', (payload) => {
    batch.approveRows()
    batch.iframe.close()
    // do server setuff
    batch.updateRecords(/*...*/)
    batch.iframe.open()
  })

  batch.on('record:update', () => {
    // do something with the updated record
    batch.updateRecords({ id: '123', foo: 'bar' })
  })

  batch.on('record:create', () => {
    // do something with the created record
  })
}
