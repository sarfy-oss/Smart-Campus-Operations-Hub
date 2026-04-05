export const adminWorkspaceBaseStyles = String.raw`
.aw-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 285px 1fr;
  background: #f2f4f8;
  color: #101828;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.aw-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.aw-topbar {
  min-height: 82px;
  background: #f8f9fc;
  border-bottom: 1px solid #d9dee8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 30px;
}

.aw-topbar h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d2433;
}

.aw-user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #2b3444;
}

.aw-logout-btn {
  border: 1px solid #d4d9e2;
  border-radius: 6px;
  background: #fff;
  color: #2b3444;
  font-size: 14px;
  padding: 6px 10px;
  cursor: pointer;
}

.aw-content {
  padding: 22px 30px 30px;
}

.aw-hero {
  background: linear-gradient(135deg, #ffffff 0%, #eef4ff 100%);
  border: 1px solid #dce2ec;
  border-radius: 14px;
  padding: 22px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 18px;
}

.aw-hero h2 {
  margin: 0 0 10px;
  font-size: 28px;
  color: #1d2433;
}

.aw-hero p {
  margin: 0;
  color: #5b667a;
  line-height: 1.6;
  max-width: 700px;
}

.aw-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.aw-hero-actions button {
  border-radius: 9px;
}

.aw-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.aw-stat-card {
  background: #ffffff;
  border: 1px solid #dce2ec;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(15, 35, 73, 0.04);
}

.aw-stat-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 10px;
}

.aw-stat-value {
  font-size: 30px;
  font-weight: 700;
  color: #1d2433;
  line-height: 1;
}

.aw-stat-note {
  margin-top: 8px;
  color: #5b667a;
  font-size: 14px;
}

.aw-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 18px;
}

.aw-card {
  background: #ffffff;
  border: 1px solid #dce2ec;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(15, 35, 73, 0.04);
  overflow: hidden;
}

.aw-card-header {
  padding: 16px 18px;
  border-bottom: 1px solid #e6ebf2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.aw-card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1d2433;
}

.aw-card-header span,
.aw-card-header small {
  color: #64748b;
}

.aw-card-body {
  padding: 18px;
}

.aw-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aw-list-item {
  border: 1px solid #e1e7f1;
  border-radius: 10px;
  padding: 14px;
  background: #f8f9fc;
}

.aw-list-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  font-weight: 600;
  color: #223046;
}

.aw-list-meta {
  color: #5b667a;
  font-size: 14px;
}

.aw-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.aw-chip-good {
  background: #d7f3df;
  color: #237d3b;
}

.aw-chip-warn {
  background: #fff3d6;
  color: #8b5d05;
}

.aw-chip-bad {
  background: #fee2e2;
  color: #991b1b;
}

.aw-chip-neutral {
  background: #e9edf4;
  color: #55627a;
}

.aw-table-wrap {
  overflow-x: auto;
}

.aw-table {
  width: 100%;
  border-collapse: collapse;
}

.aw-table thead {
  background: #f2f4f8;
}

.aw-table th,
.aw-table td {
  padding: 13px 16px;
  border-bottom: 1px solid #e0e6ef;
  font-size: 14px;
  color: #253041;
  vertical-align: top;
}

.aw-table th {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.aw-empty,
.aw-loading {
  padding: 40px 18px;
  text-align: center;
  color: #64748b;
}

@media (max-width: 1200px) {
  .aw-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .aw-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .aw-page {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .aw-topbar {
    padding: 16px 20px;
    align-items: flex-start;
    flex-direction: column;
  }

  .aw-content {
    padding: 18px 20px 24px;
  }

  .aw-hero {
    flex-direction: column;
  }

  .aw-stat-grid {
    grid-template-columns: 1fr;
  }

  .aw-user-menu {
    width: 100%;
    justify-content: space-between;
  }
}
`;
