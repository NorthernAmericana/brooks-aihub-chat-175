import { headers } from "next/headers";
import { MyFlowerAiDashboard } from "./myflower-dashboard";
import type { MyFlowerDaySummary } from "./types";

const buildBaseUrl = () => {
  const headerList = headers();
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  if (!host) {
    return "";
  }
  return `${protocol}://${host}`;
};

const fetchDaySummary = async (date: string) => {
  const headerList = headers();
  const cookie = headerList.get("cookie") ?? "";
  const baseUrl = buildBaseUrl();
  const response = await fetch(
    `${baseUrl}/api/myflower/day?date=${date}`,
    {
      headers: cookie ? { cookie } : undefined,
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    return {
      authRequired: true,
      errorMessage: null,
      data: null,
    } as const;
  }

  if (!response.ok) {
    return {
      authRequired: false,
      errorMessage: "Unable to load daily usage.",
      data: null,
    } as const;
  }

  const data = (await response.json()) as MyFlowerDaySummary;
  return {
    authRequired: false,
    errorMessage: null,
    data,
  } as const;
};

export default async function MyFlowerAiHomePage() {
  const date = new Date().toISOString().slice(0, 10);
  const { authRequired, errorMessage, data } = await fetchDaySummary(date);

  return (
    <MyFlowerAiDashboard
      authRequired={authRequired}
      date={date}
      errorMessage={errorMessage}
      initialDay={data}
    />
  );
}
