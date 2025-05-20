import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  TextField, 
  IconButton, 
  Typography, 
  AppBar, 
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  IconButton as MuiIconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const messagesEndRef = useRef(null);
  const drawerWidth = 260;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.response };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Create new conversation or update existing one
      if (!currentConversation) {
        const newConversation = {
          id: Date.now(),
          title: input,
          messages: finalMessages,
          timestamp: new Date()
        };
        setConversations(prevConversations => [newConversation, ...prevConversations]);
        setCurrentConversation(newConversation.id);
      } else {
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === currentConversation 
              ? { ...conv, messages: finalMessages }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    // Only clear the current view, don't affect the conversations list
    setMessages([]);
    setCurrentConversation(null);
    setInput('');
    setIsLoading(false);
  };

  const handleConversationClick = (conversation) => {
    setCurrentConversation(conversation.id);
    setMessages(conversation.messages);
  };

  const handleMenuClick = (event, conversation) => {
    setAnchorEl(event.currentTarget);
    setSelectedConversation(conversation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConversation(null);
  };

  const handleRenameClick = () => {
    setNewTitle(selectedConversation.title);
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  const handleRenameConfirm = () => {
    setConversations(conversations.map(conv =>
      conv.id === selectedConversation.id
        ? { ...conv, title: newTitle }
        : conv
    ));
    setRenameDialogOpen(false);
  };

  const handleDeleteClick = () => {
    setConversations(conversations.filter(conv => conv.id !== selectedConversation.id));
    if (currentConversation === selectedConversation.id) {
      setMessages([]);
      setCurrentConversation(null);
    }
    handleMenuClose();
  };

  const groupConversationsByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    return {
      today: conversations.filter(conv => new Date(conv.timestamp) >= today),
      yesterday: conversations.filter(conv => {
        const date = new Date(conv.timestamp);
        return date >= yesterday && date < today;
      }),
      lastWeek: conversations.filter(conv => {
        const date = new Date(conv.timestamp);
        return date >= lastWeek && date < yesterday;
      }),
      older: conversations.filter(conv => new Date(conv.timestamp) < lastWeek)
    };
  };

  const groupedConversations = groupConversationsByDate();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#202123',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleNewChat}
            fullWidth
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            New Chat
          </Button>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <List sx={{ overflow: 'auto', height: 'calc(100vh - 80px)' }}>
          {Object.entries(groupedConversations).map(([group, convs]) => (
            convs.length > 0 && (
              <React.Fragment key={group}>
                <ListItem>
                  <ListItemText
                    primary={group.charAt(0).toUpperCase() + group.slice(1)}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.875rem',
                    }}
                  />
                </ListItem>
                {convs.map((conversation) => (
                  <ListItem
                    key={conversation.id}
                    disablePadding
                    sx={{
                      backgroundColor: currentConversation === conversation.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleConversationClick(conversation)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={conversation.title}
                        sx={{
                          color: 'white',
                          '& .MuiTypography-root': {
                            fontSize: '0.875rem',
                          },
                        }}
                      />
                      <MuiIconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, conversation);
                        }}
                        sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        <MoreVertIcon />
                      </MuiIconButton>
                    </ListItemButton>
                  </ListItem>
                ))}
              </React.Fragment>
            )
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {currentConversation ? conversations.find(c => c.id === currentConversation)?.title : 'New Chat'}
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container 
          maxWidth="md" 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            py: 2,
            height: 'calc(100vh - 64px)'
          }}
        >
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              mb: 2,
              px: 2
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '800px',
                    width: '100%',
                    backgroundColor: message.role === 'user' 
                      ? index % 2 === 0 
                        ? 'rgba(16, 163, 127, 0.1)'  // Light green for even messages
                        : 'rgba(16, 163, 127, 0.05)' // Lighter green for odd messages
                      : 'background.paper',
                    p: 2,
                    borderRadius: 2
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      color: 'text.primary',
                      fontSize: '1rem',
                      lineHeight: 1.6
                    }}
                  >
                    {message.content}
                  </Typography>
                </Box>
              </Box>
            ))}
            {isLoading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '800px',
                    width: '100%',
                    backgroundColor: 'background.paper',
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <CircularProgress size={20} thickness={4} sx={{ color: 'primary.main' }} />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'text.primary',
                      fontSize: '1rem',
                      lineHeight: 1.6
                    }}
                  >
                    Generating response...
                  </Typography>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
          
          <Box
            sx={{
              position: 'relative',
              maxWidth: '800px',
              width: '100%',
              mx: 'auto',
              px: 2
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                backgroundColor: 'background.paper',
                borderRadius: 2,
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Send a message..."
                variant="outlined"
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.default',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                sx={{ 
                  alignSelf: 'flex-end',
                  '&:hover': {
                    backgroundColor: 'rgba(16, 163, 127, 0.1)',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#202123',
            color: 'white',
          },
        }}
      >
        <MenuItem onClick={handleRenameClick}>
          <EditIcon sx={{ mr: 1 }} /> Rename
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#202123',
            color: 'white',
          },
        }}
      >
        <DialogTitle>Rename Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button onClick={handleRenameConfirm} sx={{ color: 'primary.main' }}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App; 