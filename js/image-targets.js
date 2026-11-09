// Multiple printed layouts can award the same logical stamp. Keep primary indices/order.
export function expandImageTargets(points) {
  const primary=points.map(point=>({...point}));
  const variants=points.flatMap(point=>(point.targetVariants||[]).map(variant=>({...point,...variant,id:point.id})));
  const result=[...primary,...variants],indices=new Set();
  for(const point of result){
    if(!Number.isInteger(point.targetIndex)||point.targetIndex<0||indices.has(point.targetIndex)){
      throw new Error('画像ターゲットの番号が重複、または不正です');
    }
    indices.add(point.targetIndex);
  }
  return result;
}
