// src/components/SearchResults.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchResults = ({ 
  results, 
  query, 
  onClose, 
  navigation, 
  addToCart, 
  addingProductId 
}) => {
  if (results.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color="#BDBDBD" />
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptyText}>
          We couldn't find any products matching "{query}"
        </Text>
        <TouchableOpacity style={styles.clearButton} onPress={onClose}>
          <Text style={styles.clearButtonText}>Clear Search</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderResultItem = ({ item }) => {
    const isAdding = addingProductId === (item.id || item._id);

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => {
          onClose();
          navigation.navigate('ProductDetail', {
            productId: item.id || item._id,
            product: item,
          });
        }}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300407e?w=100&h=100&fit=crop' }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productUnit} numberOfLines={1}>
            {item.unit || 'piece'}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>
              GH₵ {item.price?.toFixed(2) || item.price}
            </Text>
            <TouchableOpacity
              style={[styles.addButton, isAdding && styles.addingButton]}
              onPress={() => addToCart(item)}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="cart-outline" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Found {results.length} result{results.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#757575" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={(item) => item.id || item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2E7D32',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addingButton: {
    backgroundColor: '#81C784',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#424242',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default SearchResults;