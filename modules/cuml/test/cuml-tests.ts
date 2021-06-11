import {DataFrame} from '@rapidsai/cudf';
import {MetricType, trustworthinessDF, UMAP} from '@rapidsai/cuml';

const df = DataFrame.readCSV({
  header: 0,
  sourceType: 'files',
  sources: ['./debug/iris.csv'],
  dataTypes: {
    sepal_length: 'float32',
    sepal_width: 'float32',
    petal_length: 'float32',
    petal_width: 'float32',
    target: 'float32'
  }
});
const X  = df.drop(['target']);
const y  = df.get('target');

test('fit_transform trustworthiness score', () => {
  const umap  = new UMAP({
    nNeighbors: 10,
    minDist: 0.01,
    randomState: 12,
    targetNNeighbors: -1,
    targetMetric: MetricType.CATEGORICAL
  });
  const t1    = umap.fitTransformDF(X, y, true);
  const trust = trustworthinessDF(X, t1, 10);

  expect(trust).toBeGreaterThan(0.97);
});

test('transform trustworthiness score', () => {
  const umap = new UMAP({
    nNeighbors: 10,
    minDist: 0.01,
    nEpochs: 800,
    init: 0,
    randomState: 42,
    targetNNeighbors: -1,
    targetMetric: MetricType.CATEGORICAL
  });
  umap.fitDF(X, y, true);
  const t1    = umap.transformDF(X, true, 'dataframe');
  const score = trustworthinessDF(X, t1, 10);

  expect(score).toBeGreaterThan(0.97);
});
