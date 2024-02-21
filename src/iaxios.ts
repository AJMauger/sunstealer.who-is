import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosProxyConfig } from "axios";
import * as https from "https";
import { IHTTPS, _logger } from "./index";

const httpsAgent: https.Agent = new https.Agent();
const proxy: AxiosProxyConfig = undefined;

export class Axios implements IHTTPS {
  // ajm: -----------------------------------------------------------------------------------------
  public async Delete(uri: string, c: any, h: any): Promise<any> {
    try {
      const arc: AxiosRequestConfig = {
        headers: h,
        httpsAgent,
        proxy: proxy,
      };

      return axios.delete<any>(uri, arc).then((response: AxiosResponse) => {
        return Promise.resolve({
          data: response.data,
          headers: response.headers,
          status: response.status,
          text: response.statusText,
        });
      }).catch((e: AxiosError) => {
        _logger.LogError(`https: Delete() message: ${e.message}, uri: ${uri}, status: ${e.response === undefined ? -1 : e.response.status}`);
        if (e.response === undefined) {
          return Promise.resolve({
            status: -1,
          });
        } else {
          _logger.LogInformation(`e.response.data: ${JSON.stringify(e.response.data)}`);
          return Promise.resolve({
            data: e.response.data,
            headers: e.response.headers,
            status: e.response.status,
            text: e.response.statusText,
          });
        }
      });
    } catch (e) {
      _logger.LogException(e);
    }
  }

  // ajm: -----------------------------------------------------------------------------------------
  public async Get(uri: string, c: any, h: any): Promise<any> {
    try {
      const arc: AxiosRequestConfig = {
        headers: { ...h },
        httpsAgent,
        proxy: proxy,
      };

      _logger.LogDebug(`ihttps: Get(${uri})`);

      return axios.get<any>(uri, arc).then((response: AxiosResponse) => {
        return Promise.resolve({
          data: response.data,
          headers: response.headers,
          status: response.status,
          text: response.statusText,
        });
      }).catch((e: AxiosError) => {
        if (e.response === undefined) {
          return Promise.resolve({
            status: -1,
          });
        } else {
          _logger.LogInformation(`ERROR: e.response.data: ${JSON.stringify(e.response.data)}`);
          return Promise.resolve({
            data: e.response.data,
            headers: e.response.headers,
            status: e.response.status,
            text: e.response.statusText,
          });
        }
      });
    } catch (e) {
      _logger.LogException(e);
    }
  }

  // ajm: -----------------------------------------------------------------------------------------
  public async Post(uri: string, b: any, c: any, h: any): Promise<any> {
    try {
      const arc: AxiosRequestConfig = {
        headers: { ...h },
        httpsAgent,
        proxy: proxy,
      };

      return axios.post<any>(uri, b, arc).then((response: AxiosResponse) => {
        return Promise.resolve({
          data: response.data,
          headers: response.headers,
          status: response.status,
          text: response.statusText,
        });
      }).catch((e: AxiosError) => {
        _logger.LogError(`https: Post() message: ${e.message}, uri: ${uri}, status: ${e.response === undefined ? -1 : e.response.status}`);
        if (e.response === undefined) {
          return Promise.resolve({
            status: -1,
          });
        } else {
          _logger.LogInformation(`e.response.data: ${JSON.stringify(e.response.data)}`);
          return Promise.resolve({
            data: e.response.data,
            headers: e.response.headers,
            status: e.response.status,
            text: e.response.statusText,
          });
        }
      });
    } catch (e) {
      _logger.LogException(e);
    }
  }

  // ajm: -----------------------------------------------------------------------------------------
  public async Put(uri: string, b: any, c: any, h: any): Promise<any> {
    try {
      const arc: AxiosRequestConfig = {
        headers: { ...h },
        httpsAgent,
        proxy: proxy,
      };

      return axios.put<any>(uri, b, arc).then((response: AxiosResponse) => {
        return Promise.resolve({
          data: response.data,
          headers: response.headers,
          status: response.status,
          text: response.statusText,
        });
      }).catch((e: AxiosError) => {
        _logger.LogError(`https: Put() message: ${e.message}, uri: ${uri}, status: ${e.response === undefined ? -1 : e.response.status}`);
        if (e.response === undefined) {
          return Promise.resolve({
            status: -1,
          });
        } else {
          _logger.LogInformation(`e.response.data: ${JSON.stringify(e.response.data)}`);
          return Promise.resolve({
            data: e.response.data,
            headers: e.response.headers,
            status: e.response.status,
            text: e.response.statusText,
          });
        }
      });
    } catch (e) {
      _logger.LogException(e);
    }
  }
}
