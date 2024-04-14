const express = require("express");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, "pdf-file.pdf");
  },
});
const upload = multer({ storage: storage });

const app = express();
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({ credentials: true, origin: true }));
const PORT = 8000;

app.post("/sendPDF", upload.single("file"), async (req, res) => {
  const formData = new FormData();
  formData.append("file", fs.createReadStream("./uploads/pdf-file.pdf"));

  console.log(formData.getHeaders());
  const options = {
    headers: {
      "x-api-key": "sec_x0y2k282LJ8tOonm9OErrxa2s8vRIr3J",
      ...formData.getHeaders(),
    },
  };

  axios
    .post("https://api.chatpdf.com/v1/sources/add-file", formData, options)
    .then((response) => {
      console.log("Source ID:", response.data.sourceId);
      res.cookie("sourceId", response.data.sourceId, {
        httpOnly: false,
        sameSite: "none",
        secure: true,
      });
      res.status(200).json({
        success: true,
        sourceId: response.data.sourceId,
      });
    })
    .catch((error) => {
      console.log("Error:", error.message);
      console.log("Response:", error.response.data);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    });
});

app.post("/sendMessage", (req, res) => {
  const sourceId = req.cookies.sourceId;
  console.log(req.body.message);
  const config = {
    headers: {
      "x-api-key": "sec_x0y2k282LJ8tOonm9OErrxa2s8vRIr3J",
      "Content-Type": "application/json",
    },
  };

  console.log("config", config);

  const data = {
    sourceId: sourceId,
    messages: [
      {
        role: "user",
        content: req.body.message,
      },
    ],
  };

  console.log("data", data);

  axios
    .post("https://api.chatpdf.com/v1/chats/message", data, config)
    .then((response) => {
      console.log("Result:", response.data.content);
      res.status(200).json({
        success: true,
        message: response.data.content,
      });
    })
    .catch((error) => {
      console.log("data", data);
      console.error("Error:", error.message);
      console.log("Response:", error.response.data);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    });
});

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
