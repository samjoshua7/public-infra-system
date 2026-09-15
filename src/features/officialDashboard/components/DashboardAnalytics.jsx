import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { STATUS_LABELS, STATUS_COLORS } from '../../../lib/reportStatus';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a28CFE'];
const GAUGE_COLORS = ['#2e7d32', '#e0e0e0']; // Resolved, Open

const categoryLabels = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  traffic_light: 'Traffic Light',
  garbage: 'Garbage',
  other: 'Other',
};

export const DashboardAnalytics = ({ stats }) => {
  if (!stats) return null;

  // Prepare data for Bar Chart (Category)
  const categoryData = Object.keys(stats.categoryCounts).map(key => ({
    name: categoryLabels[key] || key,
    count: stats.categoryCounts[key]
  })).sort((a, b) => b.count - a.count);

  // Prepare data for Pie Chart (Status)
  const statusData = Object.keys(stats.statusCounts).map(key => ({
    name: STATUS_LABELS[key] || key,
    count: stats.statusCounts[key],
    color: STATUS_COLORS[key] === 'warning' ? '#ed6c02' 
      : STATUS_COLORS[key] === 'info' ? '#0288d1' 
      : STATUS_COLORS[key] === 'success' ? '#2e7d32' 
      : '#1976d2'
  }));

  // Prepare data for Timeline Line Chart
  const sortedDates = Object.keys(stats.timelineCounts || {}).sort();
  const timelineData = sortedDates.map(date => ({
    date: date.substring(5), // MM-DD
    count: stats.timelineCounts[date]
  }));

  // Prepare Gauge Data
  const resolutionRate = stats.totalReports > 0 ? ((stats.resolvedReports / stats.totalReports) * 100).toFixed(0) : 0;
  const gaugeData = [
    { name: 'Resolved', value: stats.resolvedReports },
    { name: 'Open', value: stats.openReports }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        {/* ROW 1 */}
        {/* Gauge Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, alignSelf: 'flex-start' }}>Resolution Rate</Typography>
            <Box sx={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={GAUGE_COLORS[0]} />
                    <Cell fill={GAUGE_COLORS[1]} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Typography variant="h3" fontWeight="800" sx={{ mt: -2 }}>
              {resolutionRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">Total Resolved Reports</Typography>
          </Paper>
        </Grid>

        {/* Line Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', height: 320 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Reports Trend</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#666' }} tickLine={false} axisLine={{ stroke: '#eee' }} />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} allowDecimals={false} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#00C49F" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Bar Chart (Category) */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', height: 320 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>By Category</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} interval={0} angle={-30} textAnchor="end" tickLine={false} axisLine={{ stroke: '#eee' }} />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} allowDecimals={false} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* ROW 2 */}
        {/* Quick Stats Column */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '320px' }}>
            <Paper sx={{ p: 2.5, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px', bgcolor: '#f8fafc', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>Total Reports</Typography>
                <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ mt: 0.5 }}>{stats.totalReports}</Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#e0f2fe', borderRadius: '50%', color: '#0284c7', display: 'flex' }}>
                <AssignmentIcon />
              </Box>
            </Paper>
            <Paper sx={{ p: 2.5, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px', bgcolor: '#fff7ed', boxShadow: 'none', border: '1px solid #ffedd5' }}>
              <Box>
                <Typography variant="caption" color="warning.dark" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>Pending</Typography>
                <Typography variant="h4" fontWeight="800" color="warning.dark" sx={{ mt: 0.5 }}>{stats.openReports}</Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#ffedd5', borderRadius: '50%', color: '#ea580c', display: 'flex' }}>
                <HourglassEmptyIcon />
              </Box>
            </Paper>
            <Paper sx={{ p: 2.5, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px', bgcolor: '#f0fdf4', boxShadow: 'none', border: '1px solid #dcfce7' }}>
              <Box>
                <Typography variant="caption" color="success.dark" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>Resolved</Typography>
                <Typography variant="h4" fontWeight="800" color="success.dark" sx={{ mt: 0.5 }}>{stats.resolvedReports}</Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#dcfce7', borderRadius: '50%', color: '#16a34a', display: 'flex' }}>
                <CheckCircleIcon />
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Pie Chart (Status) */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', height: 320 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Status Breakdown</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={60}
                  fill="#8884d8"
                  paddingAngle={5}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Horizontal Bar or Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', height: 320, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>Category Distribution</Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
              {categoryData.map((cat, idx) => (
                <Box key={idx} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="600" color="text.secondary">{cat.name}</Typography>
                    <Typography variant="body2" fontWeight="800">{cat.count}</Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 8, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ width: `${stats.totalReports > 0 ? (cat.count / stats.totalReports) * 100 : 0}%`, height: '100%', bgcolor: COLORS[idx % COLORS.length], borderRadius: 4 }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};
