// to delete files from s3 storage

// send request to lambda function to delete files
function deleteFiles(fileLinks) {
  fetch(`${process.env.AWS_S3_LAMBDA_BASE_URL}/delete`, {
    method: "DELETE",
    mode: "cors",
    body: JSON.stringify(fileLinks),
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => console.error(err));
}

module.exports = {
  deleteFiles,
};
