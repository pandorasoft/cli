import low from 'lowdb'
import lodashId from 'vbijidb'
import FileAsync from 'lowdb/adapters/FileAsync.js'

export const xtend = Object.assign;

export const DB = async({filepath,defaults = []})=>{
    const adapter = new FileAsync(filepath)
    const db = await low(adapter)
    
    db._.mixin(lodashId)

    const collection = db
    .defaults({ posts: defaults })
    .get('posts')

    return collection;
}

export const xtendpa = (args,defs)=>{
    let newArgs = {};
    if(args._.length){
        for(let i=0;i<args._.length;i++){
            let tmp = args._[i].split("=");

            if(tmp.length == 2){
                let val = tmp[1];
                val = defs[tmp[0]](val);
                newArgs[tmp[0]] = val;
                args._[i] = null;
            }
        }
    }

    args._ = args._.filter((val)=>val);
    
    for(let key in newArgs){
        args[key] = newArgs[key];
    }

    return args;
}

