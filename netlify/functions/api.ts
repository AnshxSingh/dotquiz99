// This is a simple health check endpoint for Netlify
// API calls are handled entirely client-side with localStorage
export const handler = async (event: any) => {
  const path = event.path;
  
  if (path === "/.netlify/functions/api" || path === "/api") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "DotQuiz API is running",
        timestamp: new Date().toISOString()
      })
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: "Not found" })
  };
};
