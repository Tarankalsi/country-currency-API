import axios from "axios";
import express from "express";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.get("/currency", async (req, res) => {
  const { longitude, latitude } = req.query;

  if (!longitude || !latitude) {
    res.status(400).json({
      message: "Longitude and Latitude are required.",
    });
    return;
  }

  try {
    if (!process.env.OPENCAGE_API_KEY) {
      res.status(403).json({
        message: "Missing OpenCage API key in environment variables.",
      });
    }

    const geocodeResponse = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.OPENCAGE_API_KEY}`
    );

    const geocodeData = geocodeResponse.data;

    if (!geocodeData.results || geocodeData.results.length === 0) {
      res.status(404).json({
        message: "No location data found for the given coordinates.",
      });
      return;
    }

    const result = geocodeData.results[0];
    const country = result.components.country;
    const currency = result.annotations.currency.name;
    const symbol = result.annotations.currency.symbol;

    if (!country || !currency || !symbol) {
      res.status(500).json({
        message: "Incomplete data received from the geocoding API.",
      });
      return;
    }

    res.status(200).json({
      country,
      currency,
      symbol,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          message: "Error from geocoding API.",
          details: error.response.data.status.message,
        });
        return;
      } else if (error.request) {
        res.status(503).json({
          message:
            "Unable to connect to geocoding API. Please try again later.",
        });
        return;
      }
    }

    res.status(500).json({
      message: "Internal Server Error.",
      details: error,
    });
  }
});

export default router;
