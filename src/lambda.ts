import { Callback, Context, Handler } from 'aws-lambda';

import { bootstrap } from './main';

let CachedServer: Handler;

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  CachedServer = CachedServer ?? (await bootstrap());
  return CachedServer(event, context, callback);
};
