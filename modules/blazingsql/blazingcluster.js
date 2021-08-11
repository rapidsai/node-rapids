const { BlazingCluster } = require('@rapidsai/blazingsql');
const { Series, DataFrame } = require('@rapidsai/cudf');

runQuery();

async function runQuery() {
  const df = createLargeDataFrame();

  const bc = await BlazingCluster.init({ numWorkers: 2 });

  bc.stop();
}

function createLargeDataFrame() {
  const a = Series.new(Array.from(Array(300).keys()));
  return new DataFrame({ 'a': a, 'b': a });
}
