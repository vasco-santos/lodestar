import Axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios";
import {ILogger} from "@chainsafe/lodestar-utils";
import querystring from "querystring";

export interface IHttpClientOptions {
  // Add more options if needed
  urlPrefix: string;
}

export interface IHttpQuery {
  [key: string]: string | number | boolean | string[] | number[];
}

export class HttpClient {
  private client: AxiosInstance;
  private logger: ILogger;

  public constructor(opt: Partial<IHttpClientOptions>, {logger}: {logger: ILogger}) {
    this.client = Axios.create({
      baseURL: opt.urlPrefix || "",
      timeout: 4000,
    });
    this.logger = logger;
  }

  public async get<T>(url: string, query?: IHttpQuery, opts?: AxiosRequestConfig): Promise<T> {
    try {
      if (query) url += "?" + querystring.stringify(query);
      const result: AxiosResponse<T> = await this.client.get<T>(url, opts);
      this.logger.verbose(`HttpClient GET url=${url} result=${JSON.stringify(result.data)}`);
      return result.data;
    } catch (reason) {
      this.logger.verbose(`HttpClient GET error url=${url}`);
      throw this.handleError(reason);
    }
  }

  public async post<T, T2>(url: string, data: T, query?: IHttpQuery): Promise<T2> {
    try {
      if (query) url += "?" + querystring.stringify(query);
      const result: AxiosResponse<T2> = await this.client.post(url, data);
      this.logger.verbose(`HttpClient POST url=${url} result=${JSON.stringify(result.data)}`);
      return result.data;
    } catch (reason) {
      this.logger.verbose(`HttpClient POST error url=${url}`);
      throw this.handleError(reason);
    }
  }

  private handleError = (error: AxiosError & NodeJS.ErrnoException): Error => {
    if (error.response) {
      if (error.response.status === 404) {
        error.message = "Endpoint not found";
        if (error.request && error.request.path) {
          error.message += `: ${error.request.path}`;
        }
      } else {
        error.message = error.response.data.message || "Request failed with response status " + error.response.status;
      }
    } else if (error.request) {
      error.message = error.syscall + " " + error.errno + " " + error.request._currentUrl;
    }
    error.stack = "";
    return error;
  };
}
