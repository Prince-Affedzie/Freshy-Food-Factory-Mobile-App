// src/components/ProductCard.js (updated for grid layout)
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 cards per row with padding

const ProductCard = ({
  product,
  onPress,
  onAddToCart,
  quantityInCart = 0,
  onIncrease,
  onDecrease,
  isInCart = false,
  loading = false,
  isGrid = false, // New prop for grid layout
}) => {
  const isOutOfStock = (product.stock || product.countInStock) <= 0;

  if (isGrid) {
    // Grid layout version
    return (
      <TouchableOpacity 
        style={[styles.gridContainer, { width: CARD_WIDTH }]} 
        onPress={onPress} 
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View style={styles.gridImageContainer}>
          <Image
            source={{ uri: product.images?.[0] || product.image || 'https://via.placeholder.com/150' }}
            style={styles.gridImage}
            resizeMode="cover"
          />
          
          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <View style={styles.gridOutOfStockOverlay}>
              <Text style={styles.gridOutOfStockText}>Out of Stock</Text>
            </View>
          )}
          
          {/* Low Stock Badge */}
          {!isOutOfStock && product.countInStock <= 10 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.gridInfoContainer}>
          <Text style={styles.gridName} numberOfLines={1}>
            {product.name}
          </Text>
          
          <Text style={styles.gridCategory} numberOfLines={1}>
            {product.category}
          </Text>
          
          <View style={styles.gridPriceRow}>
            <Text style={styles.gridPrice}>
              GH₵ {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </Text>
            <Text style={styles.gridUnit}>/{product.unit || 'piece'}</Text>
          </View>

          {/* Add to Cart or Quantity Controls */}
          <View style={styles.gridActionContainer}>
            {isInCart ? (
              <View style={styles.gridQuantityControls}>
                <TouchableOpacity
                  style={[styles.gridQuantityButton, (loading || quantityInCart <= 1) && styles.gridButtonDisabled]}
                  onPress={onDecrease}
                  disabled={loading || quantityInCart <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={loading || quantityInCart <= 1 ? "#CCCCCC" : "#2E7D32"} 
                  />
                </TouchableOpacity>
                
                <View style={styles.gridQuantityDisplay}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Text style={styles.gridQuantityText}>{quantityInCart}</Text>
                  )}
                </View>
                
                <TouchableOpacity
                  style={[styles.gridQuantityButton, (loading || isOutOfStock) && styles.gridButtonDisabled]}
                  onPress={onIncrease}
                  disabled={loading || isOutOfStock}
                >
                  <Ionicons 
                    name="add" 
                    size={16} 
                    color={loading || isOutOfStock ? "#CCCCCC" : "#2E7D32"} 
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.gridAddButton, (loading || isOutOfStock) && styles.gridAddButtonDisabled]}
                onPress={onAddToCart}
                disabled={loading || isOutOfStock}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons 
                      name={isOutOfStock ? "close-circle" : "add"} 
                      size={16} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.gridAddButtonText}>
                      {isOutOfStock ? 'Out of Stock' : 'Add'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Original list layout (kept for backward compatibility)
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Original list layout code remains the same */}
      <Image
        source={{ uri: product.images?.[0] || product.image || 'https://via.placeholder.com/150' }}
        style={styles.image}
        resizeMode="cover"
      />

      {isOutOfStock && (
        <View style={styles.outOfStockBadge}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}

      <View style={styles.rightContainer}>
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>GH₵ {product.price.toFixed(2)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>GH₵ {product.originalPrice.toFixed(2)}</Text>
            )}
            <Text style={styles.unit}>/{product.unit || 'piece'}</Text>
          </View>
          
          <Text style={styles.stock}>
            {isOutOfStock ? 'Out of stock' : `${product.stock || product.countInStock} available`}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          {isInCart ? (
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={onDecrease}
                disabled={loading || quantityInCart <= 1}
              >
                <Ionicons 
                  name="remove" 
                  size={20} 
                  color={loading || quantityInCart <= 1 ? "#CCCCCC" : "#2E7D32"} 
                />
              </TouchableOpacity>
              
              <View style={styles.quantityDisplay}>
                {loading ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <Text style={styles.quantityText}>{quantityInCart}</Text>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={onIncrease}
                disabled={loading || isOutOfStock}
              >
                <Ionicons 
                  name="add" 
                  size={20} 
                  color={loading || isOutOfStock ? "#CCCCCC" : "#2E7D32"} 
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, (loading || isOutOfStock) && styles.addButtonDisabled]}
              onPress={onAddToCart}
              disabled={loading || isOutOfStock}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons 
                    name="add" 
                    size={20} 
                    color={isOutOfStock ? "#CCCCCC" : "#FFFFFF"} 
                  />
                  <Text style={[styles.addButtonText, isOutOfStock && styles.addButtonTextDisabled]}>
                    {isOutOfStock ? 'Out of Stock' : 'Add'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Original list styles (keep as is)
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rightContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  unit: {
    fontSize: 12,
    color: '#666',
  },
  stock: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  actionContainer: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  addButtonTextDisabled: {
    color: '#999',
  },
  
  // Grid layout styles
  gridContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridImageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
  },
  gridOutOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOutOfStockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowStockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridInfoContainer: {
    padding: 12,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
    lineHeight: 18,
  },
  gridCategory: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginRight: 4,
  },
  gridUnit: {
    fontSize: 11,
    color: '#666',
  },
  gridActionContainer: {
    marginTop: 8,
  },
  gridQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gridQuantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gridButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  gridQuantityDisplay: {
    minWidth: 32,
    alignItems: 'center',
  },
  gridQuantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  gridAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  gridAddButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  gridAddButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default ProductCard;