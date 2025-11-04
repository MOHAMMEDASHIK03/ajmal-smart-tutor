-- Create role-based access control system
-- Step 1: Create app_role enum
CREATE TYPE public.app_role AS ENUM ('tutor', 'admin');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Step 3: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 5: Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 6: Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on students" ON public.students;
DROP POLICY IF EXISTS "Allow all operations on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all operations on fees" ON public.fees;
DROP POLICY IF EXISTS "Allow all operations on remarks" ON public.remarks;

-- Step 7: Create secure role-based policies for students table
CREATE POLICY "Tutors and admins can view students"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tutors and admins can insert students"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tutors and admins can update students"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete students"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 8: Create secure role-based policies for attendance table
CREATE POLICY "Tutors and admins can manage attendance"
  ON public.attendance
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Step 9: Create secure role-based policies for fees table
CREATE POLICY "Tutors and admins can manage fees"
  ON public.fees
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Step 10: Create secure role-based policies for remarks table
CREATE POLICY "Tutors and admins can manage remarks"
  ON public.remarks
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'tutor') OR 
    public.has_role(auth.uid(), 'admin')
  );