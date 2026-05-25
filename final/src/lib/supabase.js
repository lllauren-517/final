import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfreljxlgfrqsltswphj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmcmVsanhsZ2ZycXNsdHN3cGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTcwMjgsImV4cCI6MjA5NDU3MzAyOH0.IHSE6EuyNNeKVtbCTnB4Dtow_7eLS21elUVH4V0eug0';

export const supabase = createClient(supabaseUrl, supabaseKey);