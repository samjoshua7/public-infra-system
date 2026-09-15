import { supabase } from '../../lib/supabaseClient';
import { DEMO_REPORTS } from '../feed/demoReports';
import { dbCapabilities } from '../../lib/dbCapabilities';

// In-memory cache for comments added to demo reports during the session
const demoCommentsCache = {};

const DEMO_STATUS_HISTORIES = {
  'demo-3': [
    {
      history_id: 'dh-3-1',
      report_id: 'demo-3',
      status: 'ordered',
      note: 'Citizen reported malfunctioning traffic signal and non-responsive pedestrian walk light.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      users: { name: 'Dispatch System', role: 'CITIZEN' },
    },
    {
      history_id: 'dh-3-2',
      report_id: 'demo-3',
      status: 'on_process',
      note: 'Municipal Traffic Operations engineering crew arrived on site for signal controller diagnostics.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      users: { name: 'Officer Miller', role: 'GOVERNMENT_OFFICIAL' },
    },
    {
      history_id: 'dh-3-3',
      report_id: 'demo-3',
      status: 'finished',
      note: 'Relay board replaced and pedestrian push button synchronizer tested OK.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      users: { name: 'Lead Engineer Adams', role: 'GOVERNMENT_OFFICIAL' },
    },
  ],
  'demo-1': [
    {
      history_id: 'dh-1-1',
      report_id: 'demo-1',
      status: 'ordered',
      note: 'Pothole report received from citizen.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      users: { name: 'Dispatch System' },
    },
    {
      history_id: 'dh-1-2',
      report_id: 'demo-1',
      status: 'on_process',
      note: 'Road repair crew assigned for asphalt resurfacing.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      users: { name: 'Highway Operations', role: 'GOVERNMENT_OFFICIAL' },
    },
  ],
  'demo-2': [
    {
      history_id: 'dh-2-1',
      report_id: 'demo-2',
      status: 'ordered',
      note: 'Dark streetlight reported in residential zone.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      users: { name: 'Dispatch System' },
    },
    {
      history_id: 'dh-2-2',
      report_id: 'demo-2',
      status: 'budget_allocated',
      note: 'LED luminaire unit procured under ward maintenance budget.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      users: { name: 'Municipal Ward Officer', role: 'GOVERNMENT_OFFICIAL' },
    },
  ],
  'demo-4': [
    {
      history_id: 'dh-4-1',
      report_id: 'demo-4',
      status: 'ordered',
      note: 'Litter accumulation reported at park entrance.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      users: { name: 'Dispatch System' },
    },
  ],
};

const DEFAULT_DEMO_COMMENTS = {
  'demo-3': [
    {
      comment_id: 'dc-3-1',
      report_id: 'demo-3',
      user_id: 'u-101',
      body: 'Thank you for reporting this! Kids from the primary school cross here every afternoon.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      users: { name: 'Priya Sharma', role: 'CITIZEN' },
    },
    {
      comment_id: 'dc-3-2',
      report_id: 'demo-3',
      user_id: 'u-102',
      body: 'Traffic division confirmed technician was dispatched this morning. The timing box is getting replaced.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      users: { name: 'Officer Dave Vance', role: 'GOVERNMENT_OFFICIAL' },
    },
  ],
};

export const getReportDetail = async (reportId) => {
  // Support demo reports directly
  if (typeof reportId === 'string' && reportId.startsWith('demo-')) {
    const demo = DEMO_REPORTS.find((r) => r.report_id === reportId);
    if (demo) return demo;
  }

  const selectCols = dbCapabilities.hasAddressColumn
    ? `
        report_id,
        reporter_id,
        photo_url,
        title,
        description,
        category,
        latitude,
        longitude,
        address,
        status,
        is_hidden,
        like_count,
        comment_count,
        created_at,
        updated_at,
        users:reporter_id (name, email)
      `
    : `
        report_id,
        reporter_id,
        photo_url,
        title,
        description,
        category,
        latitude,
        longitude,
        status,
        is_hidden,
        like_count,
        comment_count,
        created_at,
        updated_at,
        users:reporter_id (name, email)
      `;

  try {
    const { data, error } = await supabase
      .from('issue_reports')
      .select(selectCols)
      .eq('report_id', reportId)
      .single();

    if (error) {
      if (dbCapabilities.hasAddressColumn && (error.code === '42703' || error.message?.includes('address'))) {
        dbCapabilities.setHasAddressColumn(false);
        return getReportDetail(reportId);
      }
      throw error;
    }
    return { ...data, address: data.address || null };
  } catch (err) {
    const fallback = DEMO_REPORTS.find((r) => r.report_id === reportId);
    if (fallback) return fallback;
    throw err;
  }
};

export const listReportComments = async (reportId) => {
  if (typeof reportId === 'string' && reportId.startsWith('demo-')) {
    const defaults = DEFAULT_DEMO_COMMENTS[reportId] || [];
    const added = demoCommentsCache[reportId] || [];
    return [...defaults, ...added];
  }

  try {
    const { data, error } = await supabase
      .from('report_comments')
      .select(
        `
        comment_id,
        report_id,
        user_id,
        body,
        created_at,
        users:user_id (name, email, role)
      `
      )
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase comment query failed, checking demo fallback:', err.message);
    const defaults = DEFAULT_DEMO_COMMENTS[reportId] || [];
    const added = demoCommentsCache[reportId] || [];
    return [...defaults, ...added];
  }
};

export const updateReportDetails = async (reportId, { title, description, category }) => {
  if (typeof reportId === 'string' && reportId.startsWith('demo-')) {
    const demo = DEMO_REPORTS.find((r) => r.report_id === reportId);
    if (demo) {
      if (title) demo.title = title;
      if (description) demo.description = description;
      if (category) demo.category = category;
      return demo;
    }
  }

  const { data, error } = await supabase
    .from('issue_reports')
    .update({ title, description, category })
    .eq('report_id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const setReportHidden = async (reportId, isHidden) => {
  if (typeof reportId === 'string' && reportId.startsWith('demo-')) {
    const demo = DEMO_REPORTS.find((r) => r.report_id === reportId);
    if (demo) {
      demo.is_hidden = isHidden;
      return demo;
    }
  }

  const { data, error } = await supabase
    .from('issue_reports')
    .update({ is_hidden: isHidden })
    .eq('report_id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteReport = async (reportId) => {
  if (typeof reportId === 'string' && reportId.startsWith('demo-')) {
    const idx = DEMO_REPORTS.findIndex((r) => r.report_id === reportId);
    if (idx !== -1) {
      DEMO_REPORTS.splice(idx, 1);
    }
    return;
  }

  const { error } = await supabase.from('issue_reports').delete().eq('report_id', reportId);
  if (error) throw error;
};

export const addReportComment = async ({ reportId, userId, body, content }) => {
  const commentText = body || content;

  if (typeof reportId === 'string' && reportId.startsWith('demo-')) {
    const newDemoComment = {
      comment_id: `demo-comment-${Date.now()}`,
      report_id: reportId,
      user_id: userId || 'demo-current-user',
      body: commentText,
      created_at: new Date().toISOString(),
      users: {
        name: 'You',
        email: 'you@civicvoice.org',
        role: 'CITIZEN',
      },
    };

    if (!demoCommentsCache[reportId]) {
      demoCommentsCache[reportId] = [];
    }
    demoCommentsCache[reportId].push(newDemoComment);

    const reportObj = DEMO_REPORTS.find((r) => r.report_id === reportId);
    if (reportObj) {
      reportObj.comment_count = (reportObj.comment_count || 0) + 1;
    }
    return newDemoComment;
  }

  const { data, error } = await supabase
    .from('report_comments')
    .insert([
      {
        report_id: reportId,
        user_id: userId,
        body: commentText,
      },
    ])
    .select(
      `
      comment_id,
      report_id,
      user_id,
      body,
      created_at,
      users:user_id (name, email, role)
    `
    )
    .single();

  if (error) throw error;
  return data;
};

export const listStatusHistory = async (reportId) => {
  if (typeof reportId === 'string' && reportId.startsWith('demo-')) {
    return DEMO_STATUS_HISTORIES[reportId] || [
      {
        history_id: `dh-${reportId}-1`,
        report_id: reportId,
        status: 'ordered',
        note: 'Report registered in civic tracking system.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        users: { name: 'System Dispatch' },
      },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('report_status_history')
      .select(
        `
        history_id,
        report_id,
        status,
        changed_by,
        note,
        created_at,
        users:changed_by (name, role)
      `
      )
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase status history query failed, checking demo fallback:', err.message);
    return DEMO_STATUS_HISTORIES[reportId] || [];
  }
};
