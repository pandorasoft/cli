import chalk from 'chalk'
import hyperspace from 'hyperspace'
const HyperspaceClient = hyperspace.Client

const FULL_USAGE = `
Examples:

  hyp daemon status
`

export default {
  name: 'daemon status',
  description: 'Check the status of the hyperspace daemon.',
  usage: {
    simple: '',
    full: FULL_USAGE
  },
  command: async function (args) {
    try {
      let client = new HyperspaceClient()
      await client.ready()
      let st = await client.status()
      const versionString = st.version ? `v${st.version}` : '(Unknown Version)'
      console.log(JSON.stringify(
        {type:'response',
        address:st.remoteAddress,
        version:versionString,
        apiVersion:st.apiVersion,
        holepunchable:st.holepunchable
      }))
    }catch {
      console.log(JSON.stringify({event:`Daemon not active`}))
    }

    process.exit(0)
  }
}