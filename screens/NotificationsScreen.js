// src/screens/main/NotificationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Header from '../components/Header';
import { getNotifications, markNotificationAsRead, deleteNotification, deleteBulkNotifications } from '../apis/notificationApi';
import { useFocusEffect } from '@react-navigation/native';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      
      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      return () => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      
      if (response.status === 200) {
        const notificationsData = response.data.data || response.data || [];
        setNotifications(notificationsData);
        applyFiltersAndSearch(notificationsData);
      } else {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSearch = (data) => {
    let filtered = [...data];

    // Apply read/unread filter
    if (filter === 'unread') {
      filtered = filtered.filter(notification => !notification.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(notification => notification.isRead);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.title?.toLowerCase().includes(query) ||
        notification.message?.toLowerCase().includes(query) ||
        notification.type?.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredNotifications(filtered);
  };

  useEffect(() => {
    applyFiltersAndSearch(notifications);
  }, [filter, searchQuery, notifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await markNotificationAsRead([notificationId]);
      
      if (response.status === 200) {
        // Update local state
        setNotifications(prev => prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        ));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(notification => !notification.isRead)
      .map(notification => notification._id);

    if (unreadIds.length === 0) {
      Alert.alert('Info', 'All notifications are already read');
      return;
    }

    try {
      const response = await markNotificationAsRead(unreadIds);
      
      if (response.status === 200) {
        // Update local state
        setNotifications(prev => prev.map(notification => 
          unreadIds.includes(notification._id)
            ? { ...notification, isRead: true }
            : notification
        ));
        Alert.alert('Success', 'All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const response = await deleteNotification(notificationId);
      
      if (response.status === 200) {
        // Remove from local state
        setNotifications(prev => prev.filter(notification => 
          notification._id !== notificationId
        ));
        // Remove from selected if exists
        setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
        
        Alert.alert('Success', 'Notification deleted');
      } else {
        Alert.alert('Error', 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) {
      Alert.alert('Info', 'Please select notifications to delete');
      return;
    }

    setBulkDeleteLoading(true);
    try {
      const response = await deleteBulkNotifications(selectedNotifications);
      
      if (response.status === 200) {
        // Remove from local state
        setNotifications(prev => prev.filter(notification => 
          !selectedNotifications.includes(notification._id)
        ));
        setSelectedNotifications([]);
        setSelectMode(false);
        
        Alert.alert('Success', `${selectedNotifications.length} notifications deleted`);
      } else {
        Alert.alert('Error', 'Failed to delete notifications');
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      Alert.alert('Error', 'Failed to delete notifications');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(notification => notification._id));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return { icon: 'cart-outline', color: '#4CAF50', bgColor: '#E8F5E8' };
      case 'delivery':
        return { icon: 'bicycle-outline', color: '#2196F3', bgColor: '#E3F2FD' };
      case 'promotion':
        return { icon: 'pricetag-outline', color: '#FF9800', bgColor: '#FFF3E0' };
      case 'system':
        return { icon: 'notifications-outline', color: '#9C27B0', bgColor: '#F3E5F5' };
      case 'warning':
        return { icon: 'warning-outline', color: '#F44336', bgColor: '#FFEBEE' };
      default:
        return { icon: 'notifications-outline', color: '#607D8B', bgColor: '#ECEFF1' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const renderRightActions = (progress, dragX, notificationId) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActions}>
        <Animated.View style={[styles.swipeAction, { transform: [{ translateX: trans }] }]}>
          <TouchableOpacity
            style={[styles.swipeButton, styles.deleteButton]}
            onPress={() => {
              setNotificationToDelete(notificationId);
              setDeleteModalVisible(true);
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderNotificationItem = ({ item }) => {
    const iconConfig = getNotificationIcon(item.type);
    const isSelected = selectedNotifications.includes(item._id);
    
    const NotificationContent = () => (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadNotification,
          isSelected && styles.selectedNotification,
        ]}
        onPress={() => {
          if (selectMode) {
            toggleSelectNotification(item._id);
          } else {
            handleMarkAsRead(item._id);
            // Navigate based on notification type
            if (item.link) {
              navigation.navigate(item.link.screen, item.link.params);
            }
          }
        }}
        onLongPress={() => setSelectMode(true)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          {/* Checkbox in select mode */}
          {selectMode && (
            <TouchableOpacity
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              onPress={() => toggleSelectNotification(item._id)}
            >
              {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </TouchableOpacity>
          )}
          
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.bgColor }]}>
            <Ionicons name={iconConfig.icon} size={24} color={iconConfig.color} />
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.notificationTime}>
                {formatDate(item.createdAt || item.date)}
              </Text>
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            {!item.isRead && !selectMode && (
              <View style={styles.unreadIndicator} />
            )}
          </View>

          {/* Action arrow */}
          {!selectMode && (
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          )}
        </View>
      </TouchableOpacity>
    );

    if (selectMode) {
      return <NotificationContent />;
    }

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item._id)}
        overshootRight={false}
      >
        <NotificationContent />
      </Swipeable>
    );
  };

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="notifications-off-outline" size={80} color="#E0E0E0" />
      </View>
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateText}>
        You're all caught up! Check back later for updates.
      </Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Ionicons name="refresh" size={20} color="#4CAF50" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Notifications" 
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <View style={styles.headerRight}>
            {selectMode ? (
              <>
                <TouchableOpacity 
                  style={styles.headerIcon}
                  onPress={toggleSelectAll}
                >
                  <Text style={styles.selectAllText}>
                    {selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerIcon}
                  onPress={() => {
                    setSelectMode(false);
                    setSelectedNotifications([]);
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.headerIcon}
                  onPress={() => setFilter('all')}
                >
                  <Ionicons name="filter-outline" size={24} color="#2E7D32" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerIcon}
                  onPress={handleMarkAllAsRead}
                >
                  <Ionicons name="checkmark-done-outline" size={24} color="#2E7D32" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerIcon}
                  onPress={() => setSelectMode(true)}
                >
                  <Ionicons name="checkmark-circle-outline" size={24} color="#2E7D32" />
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />

      {/* Search Bar */}
      {!selectMode && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Filter Tabs */}
      {!selectMode && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All
              </Text>
              <View style={[styles.filterBadge, filter === 'all' && styles.filterBadgeActive]}>
                <Text style={styles.filterBadgeText}>{notifications.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
              onPress={() => setFilter('unread')}
            >
              <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
                Unread
              </Text>
              <View style={[styles.filterBadge, filter === 'unread' && styles.filterBadgeActive]}>
                <Text style={styles.filterBadgeText}>
                  {notifications.filter(n => !n.isRead).length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filter === 'read' && styles.filterTabActive]}
              onPress={() => setFilter('read')}
            >
              <Text style={[styles.filterText, filter === 'read' && styles.filterTextActive]}>
                Read
              </Text>
              <View style={[styles.filterBadge, filter === 'read' && styles.filterBadgeActive]}>
                <Text style={styles.filterBadgeText}>
                  {notifications.filter(n => n.isRead).length}
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Selected Actions Bar */}
      {selectMode && selectedNotifications.length > 0 && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {selectedNotifications.length} selected
            </Text>
          </View>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={[styles.selectionButton, styles.markReadButton]}
              onPress={() => {
                markNotificationAsRead(selectedNotifications);
                setNotifications(prev => prev.map(notification => 
                  selectedNotifications.includes(notification._id)
                    ? { ...notification, isRead: true }
                    : notification
                ));
                setSelectedNotifications([]);
              }}
            >
              <Ionicons name="checkmark" size={18} color="#4CAF50" />
              <Text style={[styles.selectionButtonText, { color: '#4CAF50' }]}>Mark Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectionButton, styles.deleteSelectedButton]}
              onPress={() => {
                if (selectedNotifications.length === 1) {
                  setNotificationToDelete(selectedNotifications[0]);
                  setDeleteModalVisible(true);
                } else {
                  Alert.alert(
                    'Delete Notifications',
                    `Delete ${selectedNotifications.length} notifications?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: handleBulkDelete
                      }
                    ]
                  );
                }
              }}
              disabled={bulkDeleteLoading}
            >
              {bulkDeleteLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  <Text style={[styles.selectionButtonText, { color: '#FFFFFF' }]}>
                    Delete
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Notifications List */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4CAF50"
                colors={['#4CAF50']}
              />
            }
          />
        )}
      </Animated.View>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={40} color="#FF9800" />
              <Text style={styles.modalTitle}>Delete Notification</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete this notification?
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#666' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  handleDeleteNotification(notificationToDelete);
                  setDeleteModalVisible(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Import ScrollView at the top
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
    padding: 0,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  selectionBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  selectionActions: {
    flexDirection: 'row',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  markReadButton: {
    backgroundColor: '#F1F8E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  deleteSelectedButton: {
    backgroundColor: '#FF3B30',
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    backgroundColor: '#F8F9FA',
  },
  selectedNotification: {
    backgroundColor: '#F1F8E9',
    borderColor: '#4CAF50',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    right: 0,
    top: 4,
  },
  swipeActions: {
    flexDirection: 'row',
    width: 100,
    marginBottom: 12,
  },
  swipeAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationScreen;