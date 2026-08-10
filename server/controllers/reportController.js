import asyncHandler from "express-async-handler";
import {
  getSalesReport,
  getCustomerSalesReport,
  getProductSalesReport,
  getMonthlySalesReport,
} from "../services/reportService.js";
import { generateSalesReportPDF } from "../services/pdfService.js";

export const getSalesReportController = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const report = await getSalesReport(req.user._id, startDate, endDate);

  res.status(200).json(report);
});

export const getCustomerSalesReportController = asyncHandler(
  async (req, res) => {
    const { startDate, endDate } = req.query;

    const report = await getCustomerSalesReport(
      req.user._id,
      startDate,
      endDate
    );

    res.status(200).json(report);
  }
);

export const generateSalesReportPDFController = asyncHandler(
  async (req, res) => {
    const { startDate, endDate } = req.query;

    const report = await getSalesReport(req.user._id, startDate, endDate);

    const pdf = generateSalesReportPDF(report, startDate, endDate);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales-report.pdf"'
    );

    pdf.pipe(res);
  }
);

export const getProductSalesReportController =
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const report = await getProductSalesReport(
      req.user._id,
      startDate,
      endDate
    );

    res.status(200).json(report);
  });

export const getMonthlySalesReportController = asyncHandler(
  async (req, res) => {
    const { startDate, endDate } = req.query;

    const report = await getMonthlySalesReport(
      req.user._id,
      startDate,
      endDate
    );

    res.status(200).json(report);
  }
);