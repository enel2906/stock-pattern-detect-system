"""
Quick test script to verify RabbitMQ connection
"""
import asyncio
from aio_pika import connect_robust, ExchangeType

async def test_rabbitmq():
    try:
        print("🔗 Attempting to connect to RabbitMQ...")
        connection = await connect_robust("amqp://guest:guest@localhost:5672/")
        print("✅ Connected successfully!")
        
        channel = await connection.channel()
        print("✅ Channel created!")
        
        exchange = await channel.declare_exchange(
            'stock.market.data',
            ExchangeType.TOPIC,
            durable=True
        )
        print("✅ Exchange declared!")
        
        await connection.close()
        print("✅ Connection closed!")
        print("\n🎉 RabbitMQ is ready for the real-time pipeline!")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Solutions:")
        print("1. Start RabbitMQ: docker start my-rabbit")
        print("2. Wait 5-10 seconds for initialization")
        print("3. Check status: docker ps | findstr rabbit")

if __name__ == "__main__":
    asyncio.run(test_rabbitmq())
