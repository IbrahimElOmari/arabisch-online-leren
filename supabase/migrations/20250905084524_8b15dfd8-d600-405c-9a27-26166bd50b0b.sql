-- Create RPC functions for direct messaging since table types may not be updated yet

-- Function to get direct messages for a user
CREATE OR REPLACE FUNCTION public.get_direct_messages(user_id UUID)
RETURNS TABLE(
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.read, dm.created_at, dm.updated_at
  FROM direct_messages dm
  WHERE dm.sender_id = user_id OR dm.receiver_id = user_id
  ORDER BY dm.created_at DESC;
$$;

-- Function to get messages in a conversation between two users
CREATE OR REPLACE FUNCTION public.get_conversation_messages(user1_id UUID, user2_id UUID)
RETURNS TABLE(
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.read, dm.created_at, dm.updated_at
  FROM direct_messages dm
  WHERE (dm.sender_id = user1_id AND dm.receiver_id = user2_id) 
     OR (dm.sender_id = user2_id AND dm.receiver_id = user1_id)
  ORDER BY dm.created_at ASC;
$$;

-- Function to send a direct message
CREATE OR REPLACE FUNCTION public.send_direct_message(
  sender_id UUID,
  receiver_id UUID,
  message_content TEXT
)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO direct_messages (sender_id, receiver_id, content, read)
  VALUES (sender_id, receiver_id, message_content, false)
  RETURNING id;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  sender_id UUID,
  receiver_id UUID
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE direct_messages 
  SET read = true 
  WHERE direct_messages.sender_id = mark_messages_read.sender_id 
    AND direct_messages.receiver_id = mark_messages_read.receiver_id 
    AND read = false;
$$;