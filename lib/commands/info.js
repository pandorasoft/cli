import chalk from 'chalk'
import { getClient, getMirroringClient } from '../hyper/index.js'
import { statusLogger } from '../status-logger.js'
import { parseHyperUrl } from '../urls.js'
import { HyperStructInfoTracker } from '../hyper/info-tracker.js'
import {xtendpa,DB,xtend} from '../helper.js';

const FULL_USAGE = `
  If no URLs are specified, will list all hypers currently seeded.

Options:

  --live - Continuously output the current state.
  -l/--long - List the full keys of the hypers.

Examples:

  hyp info
  hyp info --live
  hyp info hyper://1234..af/
  hyp info hyper://1234..af/ hyper://fedc..21/
`

const INTERVAL_LOG = 1000;

export default {
  name: 'info',
  description: 'Show information about one (or more) hypers.',
  usage: {
    simple: '[urls...]',
    full: FULL_USAGE
  },
  options: [
    {
      name: 'long',
      default: false,
      abbr: 'l',
      boolean: true
    },
    {
      name: 'live',
      default: true,
      boolean: true
    },
    {name: 'intervalLog', default: INTERVAL_LOG, boolean: false},
    {name: 'filepath', default: '', boolean: false}
  ],
  command: async function (args) {
    xtendpa(args,{
      op:String,
      intervalLog:Number,
      intervalRestart:Number,
      filepath:String
    });

    var hyperClient = getClient()
    var mirroringClient = getMirroringClient()

    async function getStatus (key, type, discoveryKey) {
      const mirror = await mirroringClient.status(key, type)
      const network = await hyperClient.network.status(discoveryKey)
      return {
        mirror,
        network
      }
    }

    const start = async()=>{
      const response = {};
      const db = await DB({filepath:args.filepath});
      const data = await db.cloneDeep().value();
      data.map(val=>{
        if(val.id){
          response[val.keyStr] = {
            id:val.id,
            live:'off'
          };
        }
      });

      var keys = await getAllKeys(mirroringClient)
      
      keys.map(key=>{
        if(response[key]){
          response[key].live = 'on';
        }
      });

      if (!keys.length) {
        return response;
      }
  
      await Promise.all(keys.map(async (key, i) => {
        var tracker = new HyperStructInfoTracker(key)
        await tracker.attemptLoadStruct()
        var mirror = null
        var network = null
        // periodically update stdout with the status-line
        const updateStatusLine = () => {
          if (!network && !mirror) {
          } else {
            response[key] = xtend(response[key],tracker.genStatusLine(args));
          }
        }
  
        // periodically calculate the size of the hyper structure
        const updateState = async () => {
          try {
            await tracker.fetchState({wait:true})
            
            if (tracker.struct) {
              ;({ mirror, network } = await getStatus(key, tracker.struct.type, tracker.struct.discoveryKey))
            }
          } catch (e) {
            if (e.toString().includes('RPC stream destroyed')) {
              console.log('ignore',process.pid);
              // ignore
            } else {
              console.error(JSON.stringify({event:e.toString(),data:response[key]}));
            }
          }
          updateStatusLine()
        }
        await updateState()
      }))

      return response;
    }

    const startup = ()=>{
      return new Promise(async(resolve,reject)=>{
        try{
          const response = await start();
          const tmp = {
            type:'response',
            data:response
          }
          console.log(JSON.stringify({pid:process.pid,...tmp}));
          
          setTimeout(async()=>{
            try{
              await startup();
            }catch(err){
              return reject(err);
            }
          },args.intervalLog).unref()
        }catch(err){
          return reject(err);
        }
      })
    }

    await startup();
  }
}

async function getAllKeys (mirroringClient) {
  return (await mirroringClient.list()).map(s => s.key.toString('hex'))
}

function short(key) {
  return `${key.slice(0, 6)}..${key.slice(-2)}`
}