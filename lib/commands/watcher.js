import {xtendpa,DB} from '../helper.js';
import fsExtra from 'fs-extra';
import debounce from 'p-debounce';
import chokidar from 'chokidar'

const FULL_USAGE = `
Examples:

  hyp watcher
`

export default {
  name: 'watcher',
  description: 'folder watcher for sync.',
  usage: {
    simple: '[urls...]',
    full: FULL_USAGE
  },
  options: [
    {name: 'filepath', default: '', boolean: false},
    {name: 'interval', default: 5000, boolean: false}
  ],
  command: async function (args) {
    console.log(JSON.stringify({event:'start watcher'}));
    xtendpa(args,{
      filepath:String,
      interval:Number
    });

    const start = async()=>{
      const db = await DB({filepath:args.filepath});
      const data = await db.cloneDeep().value();
      if(!data.length){
        return;
      }

      for(let i=0;i<data.length;i++){
        const val = data[i];
        if(val.id && val.location){
          if(await fsExtra.pathExists(val.location)){
            watch(val.location, debounce(() => {
              // throw new Error('test');
              console.log(JSON.stringify({type:'response',...val}));
            }, args.interval),val);
          }
        }
      }
    }

    await start();

    setInterval(()=>{
      console.log(JSON.stringify({event:'heartbeat'}));
    },args.interval).unref();
  }
}

function watch (source, onchange,data) {
  const watcher = chokidar.watch(source, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinished: true
  })
  watcher.on('add', onchange)
  watcher.on('change', onchange)
  watcher.on('unlink', onchange)
  watcher.on('error',()=>{
    console.log(JSON.stringify({type:'response',...data}));
  });
  return watcher
}