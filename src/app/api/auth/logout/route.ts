import { NextRequest, NextResponse } from "next/server";
import { getOrigin } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", getOrigin(request)));

  response.cookies.delete("spotify_access_token");
  response.cookies.delete("spotify_refresh_token");
  response.cookies.delete("spotify_code_verifier");

  return response;
}
