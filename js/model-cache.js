// Aliases share static model geometry/materials instead of downloading/parsing twice.
export function createModelCache({start,attach,fail}) {
  const records=new Map();
  return {
    request(key,owner){
      const record=records.get(key);
      if(record?.mesh){attach(owner,record.mesh);return;}
      if(record){record.waiters.add(owner);return;}
      records.set(key,{owner,mesh:null,waiters:new Set()});start(owner,key);
    },
    loaded(key,owner,mesh){
      const record=records.get(key);
      if(!record||record.owner!==owner||record.mesh)return;
      record.mesh=mesh;
      for(const waiter of record.waiters)attach(waiter,mesh);
      record.waiters.clear();
    },
    failed(key,owner,error){
      const record=records.get(key);
      if(!record||record.owner!==owner)return;
      records.delete(key);
      for(const waiter of record.waiters)fail(waiter,error);
    }
  };
}
