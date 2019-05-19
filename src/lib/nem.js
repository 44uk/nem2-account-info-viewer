import {
  NetworkType,
} from 'nem2-sdk'

export const endpoint = (url, networkType = NetworkType.MIJIN_TEST) => {
  return httpKlass => new httpKlass(url, networkType);
}
