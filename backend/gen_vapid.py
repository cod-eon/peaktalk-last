from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

priv_bytes = private_key.private_numbers().private_value.to_bytes(32, 'big')
pub_bytes = public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint
)

print("PRIV_KEY=" + base64.urlsafe_b64encode(priv_bytes).decode('ascii').replace('=', ''))
print("PUB_KEY=" + base64.urlsafe_b64encode(pub_bytes).decode('ascii').replace('=', ''))
