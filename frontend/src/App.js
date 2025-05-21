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
  Button,
  Divider,
  IconButton as MuiIconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState(() => {
    const savedConversations = localStorage.getItem('conversations');
    return savedConversations ? JSON.parse(savedConversations) : [];
  });
  const [currentConversation, setCurrentConversation] = useState(() => {
    const savedCurrentConversation = localStorage.getItem('currentConversation');
    return savedCurrentConversation ? JSON.parse(savedCurrentConversation) : null;
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(window.innerWidth >= 900);
  const drawerWidth = { xs: '100%', sm: 260 };
  const [editingMessage, setEditingMessage] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Save current conversation to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentConversation', JSON.stringify(currentConversation));
  }, [currentConversation]);

  // Load messages when current conversation changes
  useEffect(() => {
    if (currentConversation) {
      const conversation = conversations.find(conv => conv.id === currentConversation);
      if (conversation) {
        setMessages(conversation.messages);
      }
    } else {
      setMessages([]);
    }
  }, [currentConversation, conversations]);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsDrawerOpen(window.innerWidth >= 900);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const response = await fetch('https://rougegpt-api.onrender.com/api/chat', {
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
    setMessages([]);
    setCurrentConversation(null);
    setInput('');
    setIsLoading(false);
  };

  const handleConversationClick = (conversation) => {
    setCurrentConversation(conversation.id);
  };

  const handleMenuClick = (event, conversation) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedConversation(conversation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConversation(null);
  };

  const handleDeleteClick = () => {
    if (selectedConversation) {
      const updatedConversations = conversations.filter(conv => conv.id !== selectedConversation.id);
      
      // Update state
      setConversations(updatedConversations);
      
      // Update localStorage directly
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      
      if (currentConversation === selectedConversation.id) {
        setMessages([]);
        setCurrentConversation(null);
        localStorage.removeItem('currentConversation');
      }
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

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const handleEditMessage = (message, index) => {
    setEditingMessage(index);
    setEditedContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (editingMessage === null || !editedContent.trim()) return;

    const updatedMessages = [...messages];
    updatedMessages[editingMessage] = {
      ...updatedMessages[editingMessage],
      content: editedContent
    };

    // Remove the AI response that followed the edited message
    if (editingMessage + 1 < updatedMessages.length) {
      updatedMessages.splice(editingMessage + 1, 1);
    }

    setMessages(updatedMessages);
    
    // Update the conversation in localStorage
    if (currentConversation) {
      const updatedConversations = conversations.map(conv =>
        conv.id === currentConversation
          ? { ...conv, messages: updatedMessages }
          : conv
      );
      setConversations(updatedConversations);
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }

    setEditingMessage(null);
    setEditedContent('');

    // Trigger a new submission with the edited content
    try {
      setIsLoading(true);
      const response = await fetch('https://rougegpt-api.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: editedContent }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.response };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Update the conversation with the new response
      if (currentConversation) {
        const updatedConversations = conversations.map(conv =>
          conv.id === currentConversation
            ? { ...conv, messages: finalMessages }
            : conv
        );
        setConversations(updatedConversations);
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
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

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditedContent('');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Drawer
        variant={window.innerWidth >= 900 ? "permanent" : "temporary"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
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
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
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
              mr: window.innerWidth < 900 ? 2 : 0
            }}
          >
            New Chat
          </Button>
          {window.innerWidth < 900 && (
            <IconButton
              onClick={() => setIsDrawerOpen(false)}
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
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
                        onClick={(e) => handleMenuClick(e, conversation)}
                        aria-label={`Options for ${conversation.title}`}
                        aria-haspopup="true"
                        aria-expanded={Boolean(anchorEl) && selectedConversation?.id === conversation.id}
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          '&:focus': {
                            outline: '2px solid rgba(255, 255, 255, 0.3)',
                            outlineOffset: '2px',
                          },
                        }}
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
        <AppBar 
          position="static" 
          color="transparent" 
          elevation={0}
          sx={{
            backgroundColor: 'background.paper',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Toolbar>
            {window.innerWidth < 900 && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setIsDrawerOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
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
            py: { xs: 1, sm: 2 },
            height: 'calc(100vh - 64px)',
            px: { xs: 1, sm: 2 }
          }}
        >
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              mb: 2,
              px: { xs: 0, sm: 2 }
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
                    maxWidth: { xs: '100%', sm: '800px' },
                    width: '100%',
                    backgroundColor: message.role === 'user' 
                      ? index % 2 === 0 
                        ? 'rgba(16, 163, 127, 0.1)'
                        : 'rgba(16, 163, 127, 0.05)'
                      : 'background.paper',
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 2,
                    position: 'relative',
                    '&:hover .message-actions': {
                      opacity: 1,
                    },
                  }}
                >
                  {editingMessage === index ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <TextField
                        multiline
                        fullWidth
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.default',
                          },
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          onClick={handleCancelEdit}
                          sx={{ color: 'text.secondary' }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleSaveEdit}
                          sx={{ bgcolor: 'primary.main' }}
                        >
                          Save
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <>
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
                      <Box
                        className="message-actions"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'flex',
                          gap: 1,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          backgroundColor: 'background.paper',
                          borderRadius: 1,
                          p: 0.5,
                        }}
                      >
                        {message.role === 'assistant' ? (
                          <Tooltip title="Copy">
                            <IconButton
                              size="small"
                              onClick={() => handleCopyMessage(message.content)}
                              sx={{ color: 'text.secondary' }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditMessage(message, index)}
                              sx={{ color: 'text.secondary' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </>
                  )}
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
                    maxWidth: { xs: '100%', sm: '800px' },
                    width: '100%',
                    backgroundColor: 'background.paper',
                    p: { xs: 1.5, sm: 2 },
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
                      fontSize: { xs: '0.875rem', sm: '1rem' },
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
              maxWidth: { xs: '100%', sm: '800px' },
              width: '100%',
              mx: 'auto',
              px: { xs: 0, sm: 2 }
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: { xs: 1, sm: 2 },
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
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
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
        onClick={handleMenuClose}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#202123',
            color: 'white',
          },
        }}
        MenuListProps={{
          'aria-labelledby': 'conversation-menu-button',
        }}
      >
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default App; 