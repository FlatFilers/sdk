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

  const importSession = await flatfile.startOrResumeImportSession({ openIframe: true })

  importSession.on('complete', (payload) => {
    importSession.approveRows()
    importSession.iframe.close()
    // do server setuff
    importSession.updateRecords(/*...*/)
    importSession.iframe.open()
  })

  importSession.on('record:update', () => {
    // do something with the updated record
    importSession.updateRecords({ id: '123', foo: 'bar' })
  })

  importSession.on('record:create', () => {
    // do something with the created record
  })
}
