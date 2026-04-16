import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { envVars } from '../config/env.utils';
import { cookieUtils } from './cookie';
import { jwtUtils } from './jwt';

const getAccessToken = (payload: JwtPayload) => {
  const accessToken = jwtUtils.createToken(
    payload,
    envVars.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN,
    } as SignOptions
  );
  return accessToken;
};

const getRefreshToken = (payload: JwtPayload) => {
  const refreshToken = jwtUtils.createToken(
    payload,
    envVars.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN,
    } as SignOptions
  );
  return refreshToken;
};

const setAccessToken = (res: any, token: string) => {
  cookieUtils.setCookie(res, 'accessToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',

    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

const setRefreshToken = (res: any, token: string) => {
  cookieUtils.setCookie(res, 'refreshToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 * 7, // 7 day
  });
};

const setBetterAuthSessionCookies = (res: any, token: string) => {
  cookieUtils.setCookie(res, 'better-auth-session-token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  setBetterAuthSessionCookies,
};
