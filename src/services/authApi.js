const AUTH_API_PATH = "/api/auth";

async function requestAuthApi(path, options){
    const response = await fetch(path, options);
    const data = await response.json();
    if(!response.ok){
        throw new Error(data.message || data.error || "驗證失敗");
    }
    return data;
}

function register(payload){
    return requestAuthApi(`${AUTH_API_PATH}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

function login(payload){
    return requestAuthApi(`${AUTH_API_PATH}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

function verifyToken(token) {
  return requestAuthApi(`${AUTH_API_PATH}/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export { register, login, verifyToken };