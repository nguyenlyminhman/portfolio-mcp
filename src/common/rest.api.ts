export const doPost = async (url: string, body: any, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json().catch(() => null);

    return { success: true, data };

  } catch (error: any) {
    const isAbort = error.name === "AbortError";
    return {
      success: false,
      error: isAbort ? "Request timeout" : error.message,
    };
  }
}

export const doGet = async (url: string, params: Record<string, string> = {}) => {
  let responseString = {};
  try {
    const fullUrl = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        fullUrl.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(fullUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept-Encoding': 'UTF-8',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} ${response.statusText}`);
    }

    responseString = await response.json().catch(() => ({}));
    return responseString;
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
}

export const doPut = (url: string, body: any, headers: Record<string, string> = {}) => {
  return {}
}

export const doPatch = (url: string, body: any, headers: Record<string, string> = {}) => {
  return {}
}

export const doDelete = (url: string, body: any, headers: Record<string, string> = {}) => {
  return {}
}
