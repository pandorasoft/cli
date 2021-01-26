import hyperspace from 'hyperspace'
const HyperspaceClient = hyperspace.Client

import { setup } from '../../hyper/index.js'

const FULL_USAGE = `
Examples:

  hyp daemon start
`
export default {
  name: 'daemon start',
  description: 'Start the hyperspace daemon.',
  usage: {
    full: FULL_USAGE
  },
  command: async function (args) {
    await setup()
    try {
      const client = new HyperspaceClient()
      await client.ready()
      const st = await client.status()
      const versionString = st.version ? `v${st.version}` : '(Unknown Version)'
      console.log(JSON.stringify(
        {type:'response',
        address:st.remoteAddress,
        version:versionString,
        apiVersion:st.apiVersion,
        holepunchable:st.holepunchable
      }))
    } catch (err) {
      console.error(JSON.stringify({event:`Could not start the daemon. Details:${err.message}`}));
      process.exit(1)
    }
    console.log(JSON.stringify({event:`Daemon is running.`}));
    process.exit(0)
  }
}
