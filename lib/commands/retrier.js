import {xtendpa,DB} from '../helper.js';

const FULL_USAGE = `
Examples:

  hyp retrier
`

export default {
  name: 'retrier',
  description: 'check status error for retry.',
  usage: {
    simple: '[urls...]',
    full: FULL_USAGE
  },
  options: [
    {name: 'filepath', default: '', boolean: false},
    {name: 'interval', default: 60000, boolean: false}
  ],
  command: async function (args) {
    console.log(JSON.stringify({event:'start retrier'}));
    xtendpa(args,{
      filepath:String,
      interval:Number
    });

    const start = async()=>{
      const response = {};
      const db = await DB({filepath:args.filepath});
      const data = await db.cloneDeep().value();
      if(data.length){
        for(let i=0;i<data.length;i++){
          const val = data[i];
          if(val.id && val.status){
            if(val.status.includes('_error')){
              response[val.id] = {
                op:val.status.split("_")[0],
                payload:data[i]
              }
            }
          }
        }

        if(Object.keys(response).length){
          console.log(JSON.stringify({type:'response',data:response}));
        }
      }

      setTimeout(()=>{
        start().catch(err=>{
          console.error(JSON.stringify({event:err.toString()}));
        })
      },args.interval).unref();
    }

    await start();
  }
}