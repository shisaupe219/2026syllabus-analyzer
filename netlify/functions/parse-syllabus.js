exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "函数工作正常" })
  };
};